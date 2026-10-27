import React from 'react';
import {
  Database,
  Layers,
  Flag,
  BarChart3,
  Activity,
  Shield,
  Key,
  Terminal,
  Globe,
  Boxes,
  Cpu,
  Wrench,
  Puzzle,
} from 'lucide-react';

interface PluginIconProps {
  icon?: string;
  id?: string;
  className?: string;
  defaultColor?: string;
}

export const PluginIcon: React.FC<PluginIconProps> = ({
  icon,
  id,
  className = 'w-4 h-4 shrink-0',
  defaultColor,
}) => {
  const token = `${icon || ''} ${id || ''}`.toLowerCase();

  if (token.includes('database') || token.includes('mmkv') || token.includes('sqlite') || token.includes('realm')) {
    return <Database className={`${className} ${defaultColor || 'text-amber-500'}`} />;
  }

  if (token.includes('layer') || token.includes('async_storage') || token.includes('async-storage') || token.includes('storage')) {
    return <Layers className={`${className} ${defaultColor || 'text-sky-500'}`} />;
  }

  if (token.includes('flag') || token.includes('toggle')) {
    return <Flag className={`${className} ${defaultColor || 'text-fuchsia-500'}`} />;
  }

  if (token.includes('chart') || token.includes('analytics')) {
    return <BarChart3 className={`${className} ${defaultColor || 'text-indigo-400'}`} />;
  }

  if (token.includes('activity') || token.includes('metric') || token.includes('pulse')) {
    return <Activity className={`${className} ${defaultColor || 'text-rose-500'}`} />;
  }

  if (token.includes('shield') || token.includes('auth') || token.includes('security')) {
    return <Shield className={`${className} ${defaultColor || 'text-emerald-500'}`} />;
  }

  if (token.includes('key') || token.includes('token')) {
    return <Key className={`${className} ${defaultColor || 'text-yellow-500'}`} />;
  }

  if (token.includes('terminal') || token.includes('console') || token.includes('log')) {
    return <Terminal className={`${className} ${defaultColor || 'text-emerald-500'}`} />;
  }

  if (token.includes('globe') || token.includes('network') || token.includes('http')) {
    return <Globe className={`${className} ${defaultColor || 'text-sky-400'}`} />;
  }

  if (token.includes('box') || token.includes('package')) {
    return <Boxes className={`${className} ${defaultColor || 'text-teal-400'}`} />;
  }

  if (token.includes('cpu') || token.includes('perf')) {
    return <Cpu className={`${className} ${defaultColor || 'text-violet-400'}`} />;
  }

  if (token.includes('wrench') || token.includes('settings') || token.includes('tool')) {
    return <Wrench className={`${className} ${defaultColor || 'text-slate-400'}`} />;
  }

  return <Puzzle className={`${className} ${defaultColor || 'text-fuchsia-500'}`} />;
};
