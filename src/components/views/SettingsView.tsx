import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  Lock,
  Database,
  Cpu,
  RefreshCw,
  AlertCircle,
  FileCode2,
} from 'lucide-react';
import { SystemSettingsState, ProviderItem, ProviderModelItem, UserRole } from '../../types';
import { api } from '../../lib/api';

interface SettingsViewProps {
  userRole: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userRole }) => {
  const [settings, setSettings] = useState<SystemSettingsState | null>(null);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [models, setModels] = useState<ProviderModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settData, provsData, modelsData] = await Promise.all([
          api.getSettings(),
          api.getProviders(),
          api.getModels(),
        ]);
        setSettings(settData);
        setProviders(provsData);
        setModels(modelsData);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || userRole !== 'ADMIN') return;

    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">การตั้งค่าระบบและเกตเวย์ (System Settings)</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            กำหนดค่ากฎการกำหนดเส้นทางเริ่มต้น, เกณฑ์การสลับระบบสำรอง, ระยะเวลาหมดเวลา และนโยบายความปลอดภัย
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการกำหนดค่า'}</span>
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>บันทึกการกำหนดค่าระบบสำเร็จ และโหลดข้อมูลเข้าสู่หน่วยความจำเกตเวย์ทันที</span>
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Gateway Defaults */}
        <div className="p-5 rounded-xl bg-[#111113] border border-[#27272a] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>ค่าเริ่มต้นการกำหนดเส้นทางเกตเวย์ (Gateway Routing Defaults)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                ผู้ให้บริการสำรองเริ่มต้น (Fallback Provider)
              </label>
              <select
                disabled={userRole !== 'ADMIN'}
                value={settings.defaultProvider}
                onChange={(e) => setSettings({ ...settings, defaultProvider: e.target.value })}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} ({p.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                โมเดลส่วนกลางเริ่มต้น (Global Model)
              </label>
              <select
                disabled={userRole !== 'ADMIN'}
                value={settings.defaultModel}
                onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.modelId}>
                    {m.name} ({m.modelId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                จำนวนครั้งลองใหม่ (Retry Attempts)
              </label>
              <input
                type="number"
                min={0}
                max={5}
                disabled={userRole !== 'ADMIN'}
                value={settings.retryCount}
                onChange={(e) => setSettings({ ...settings, retryCount: Number(e.target.value) })}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                จำนวนครั้งสลับคีย์อัตโนมัติเมื่อพบ HTTP 429
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                ระยะเวลาหมดเวลาคำขอ (Request Timeout - ms)
              </label>
              <input
                type="number"
                min={1000}
                max={120000}
                step={1000}
                disabled={userRole !== 'ADMIN'}
                value={settings.timeoutMs}
                onChange={(e) => setSettings({ ...settings, timeoutMs: Number(e.target.value) })}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                ยกเลิกและสลับเส้นทางหากไม่ได้รับการตอบกลับใน {settings.timeoutMs / 1000} วินาที
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                ระยะเวลาพักคีย์ (Cooldown Duration - วินาที)
              </label>
              <input
                type="number"
                min={30}
                max={3600}
                disabled={userRole !== 'ADMIN'}
                value={settings.cooldownDurationSec}
                onChange={(e) =>
                  setSettings({ ...settings, cooldownDurationSec: Number(e.target.value) })
                }
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                ระยะเวลากักกันคีย์ที่ติด Rate Limit ก่อนนำกลับมาใช้
              </span>
            </div>
          </div>
        </div>

        {/* Rotation & Logging */}
        <div className="p-5 rounded-xl bg-[#111113] border border-[#27272a] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>การประสานการทำงานและบันทึกข้อมูล (Orchestration & Telemetry)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                กลยุทธ์การหมุนเวียนคีย์เริ่มต้น
              </label>
              <select
                disabled={userRole !== 'ADMIN'}
                value={settings.keyRotationStrategy}
                onChange={(e: any) =>
                  setSettings({ ...settings, keyRotationStrategy: e.target.value })
                }
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                <option value="ROUND_ROBIN">เวียนรอบลำดับ (Round Robin)</option>
                <option value="LEAST_USED">ใช้น้อยที่สุดก่อน (Least Used)</option>
                <option value="RANDOM">สุ่มเลือก (Random)</option>
                <option value="PRIORITY">ตามระดับความสำคัญ (Priority Tier)</option>
                <option value="FAILOVER">สลับเมื่อล้มเหลวทันที (Instant Failover)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                ระดับการเก็บบันทึกระบบ (Logging Verbosity)
              </label>
              <select
                disabled={userRole !== 'ADMIN'}
                value={settings.loggingLevel}
                onChange={(e: any) => setSettings({ ...settings, loggingLevel: e.target.value })}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                <option value="VERBOSE">VERBOSE (ละเอียดทุกโทเค็นและ latency)</option>
                <option value="INFO">INFO (มาตรฐานการใช้งานจริง)</option>
                <option value="WARN">WARN (เฉพาะการเตือนและลองใหม่)</option>
                <option value="ERROR">ERROR (เฉพาะข้อผิดพลาดร้ายแรง)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161619] border border-[#27272a]">
            <div>
              <div className="text-xs font-medium text-white">โหมดปิดปรับปรุงระบบ (Maintenance Mode)</div>
              <div className="text-[11px] text-zinc-400">
                เมื่อเปิดใช้งาน เกตเวย์จะปฏิเสธคำขอจากภายนอกด้วย HTTP 503 แต่ยังคงอนุญาตให้ผู้ดูแลระบบทดสอบได้
              </div>
            </div>
            <input
              type="checkbox"
              disabled={userRole !== 'ADMIN'}
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500"
            />
          </div>
        </div>

        {/* Security & Infrastructure Status */}
        <div className="p-5 rounded-xl bg-[#111113] border border-[#27272a] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>ความปลอดภัยและโครงสร้างพื้นฐาน (Infrastructure & Security)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#161619] border border-[#27272a]">
              <div className="text-zinc-400 text-[11px]">ระบบฐานข้อมูล</div>
              <div className="font-semibold text-white mt-1">PostgreSQL + Prisma</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">โครงสร้างซิงค์สมบูรณ์</div>
            </div>

            <div className="p-3 rounded-lg bg-[#161619] border border-[#27272a]">
              <div className="text-zinc-400 text-[11px]">การเข้ารหัสลับคีย์</div>
              <div className="font-semibold text-white mt-1">AES-256-CBC</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">คีย์ความลับทำงานอยู่</div>
            </div>

            <div className="p-3 rounded-lg bg-[#161619] border border-[#27272a]">
              <div className="text-zinc-400 text-[11px]">มาตรฐานเกตเวย์</div>
              <div className="font-semibold text-white mt-1">OpenAI v1 Compatible</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">พอร์ต 3000 Ingress</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
