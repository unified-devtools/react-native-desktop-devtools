mod ws_server;

use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use ws_server::{broadcast_message, start_ws_server, PeerMap, ServerState};

#[tauri::command]
async fn send_to_mobile(message: String, state: State<'_, ServerState>) -> Result<(), String> {
    broadcast_message(&state.peers, &message).await;
    Ok(())
}

#[tauri::command]
async fn get_connected_clients_count(state: State<'_, ServerState>) -> Result<usize, String> {
    let peers = state.peers.lock().await;
    Ok(peers.len())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let peers: PeerMap = Arc::new(Mutex::new(HashMap::new()));
    let peers_clone = peers.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ServerState { peers })
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_ws_server(app_handle, peers_clone).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_to_mobile,
            get_connected_clients_count
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
