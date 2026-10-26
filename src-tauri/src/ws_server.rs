use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::tungstenite::Message;

pub type Tx = mpsc::UnboundedSender<Message>;
pub type PeerMap = Arc<Mutex<HashMap<SocketAddr, Tx>>>;

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceInfo {
    pub id: String,
    pub address: String,
    pub connected_at: u64,
}

pub struct ServerState {
    pub peers: PeerMap,
}

pub async fn start_ws_server(app_handle: AppHandle, peers: PeerMap) {
    let addr = "0.0.0.0:9020";
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => {
            println!("[DevTools WS Server] Listening on ws://{}", addr);
            l
        }
        Err(e) => {
            eprintln!("[DevTools WS Server] Failed to bind to {}: {}", addr, e);
            return;
        }
    };

    while let Ok((stream, addr)) = listener.accept().await {
        let app_handle_clone = app_handle.clone();
        let peers_clone = peers.clone();

        tokio::spawn(async move {
            handle_connection(stream, addr, app_handle_clone, peers_clone).await;
        });
    }
}

async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    app_handle: AppHandle,
    peers: PeerMap,
) {
    let ws_stream = match tokio_tungstenite::accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("[DevTools WS] Error during WebSocket handshake: {}", e);
            return;
        }
    };

    println!("[DevTools WS] New client connected: {}", addr);

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    peers.lock().await.insert(addr, tx);

    // Notify Tauri frontend of new connection
    let _ = app_handle.emit(
        "client-connected",
        serde_json::json!({
            "address": addr.to_string(),
            "timestamp": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis(),
        }),
    );

    // Forward outbound messages from channel to WebSocket sink
    let forward_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    // Process inbound messages from WebSocket stream
    while let Some(msg_result) = ws_receiver.next().await {
        match msg_result {
            Ok(Message::Text(text)) => {
                // Emit raw JSON message to Tauri frontend
                let _ = app_handle.emit(
                    "devtools-message",
                    serde_json::json!({
                        "from": addr.to_string(),
                        "data": text
                    }),
                );
            }
            Ok(Message::Binary(_)) => {
                // Future use for binary assets or memory snapshots
            }
            Ok(Message::Ping(_ping)) => {
                // Handled automatically or respond with pong
            }
            Ok(Message::Close(_)) => {
                break;
            }
            Err(e) => {
                eprintln!("[DevTools WS] Read error from {}: {}", addr, e);
                break;
            }
            _ => {}
        }
    }

    forward_task.abort();
    peers.lock().await.remove(&addr);
    println!("[DevTools WS] Client disconnected: {}", addr);

    let _ = app_handle.emit(
        "client-disconnected",
        serde_json::json!({
            "address": addr.to_string()
        }),
    );
}

pub async fn broadcast_message(peers: &PeerMap, message: &str) {
    let peers_guard = peers.lock().await;
    for tx in peers_guard.values() {
        let _ = tx.send(Message::Text(message.to_string().into()));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_broadcast_message_to_peers() {
        let peers: PeerMap = Arc::new(Mutex::new(HashMap::new()));
        let addr = "127.0.0.1:9020".parse::<SocketAddr>().unwrap();
        let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

        peers.lock().await.insert(addr, tx);

        broadcast_message(&peers, r#"{"type":"test","data":"hello"}"#).await;

        let received = rx.recv().await.expect("Expected message from broadcast");
        if let Message::Text(txt) = received {
            assert!(txt.contains("hello"));
        } else {
            panic!("Expected text message");
        }
    }

    #[tokio::test]
    async fn test_peer_registration_and_removal() {
        let peers: PeerMap = Arc::new(Mutex::new(HashMap::new()));
        let addr = "127.0.0.1:9021".parse::<SocketAddr>().unwrap();
        let (tx, _) = mpsc::unbounded_channel::<Message>();

        peers.lock().await.insert(addr, tx);
        assert_eq!(peers.lock().await.len(), 1);

        peers.lock().await.remove(&addr);
        assert_eq!(peers.lock().await.len(), 0);
    }
}

