import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Save, Settings as SettingsIcon, Truck } from 'lucide-react';
import { adminApi, AdminApiError } from '../adminApi';
import { Button, Card, ErrorNote, Field, Input, SectionHeader, Spinner, Textarea } from '../ui';
import { formatNaira } from '../ui';

interface SettingsState {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  allowNewListings: boolean;
  supportEmail: string;
  supportPhone: string;
  featuredCategoryLimit: number;
}

export const SettingsSection: React.FC<{
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ notify }) => {
  const [state, setState] = useState<SettingsState | null>(null);
  const [shippingFees, setShippingFees] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, healthRes] = await Promise.all([adminApi.settings.get(), adminApi.health()]);
      const s = settingsRes.settings;
      setState({
        maintenanceMode: Boolean(s.maintenanceMode),
        maintenanceMessage: String(s.maintenanceMessage ?? ''),
        allowNewRegistrations: Boolean(s.allowNewRegistrations),
        allowNewListings: Boolean(s.allowNewListings),
        supportEmail: String(s.supportEmail ?? ''),
        supportPhone: String(s.supportPhone ?? ''),
        featuredCategoryLimit: Number(s.featuredCategoryLimit ?? 12),
      });
      setShippingFees((healthRes.shippingFees ?? {}) as Record<string, number>);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!state) return;
    setSaving(true);
    try {
      await adminApi.settings.update({ ...state });
      notify('Platform settings saved');
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !state) return <Spinner label="Loading platform settings…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Platform settings"
        subtitle="Global switches that affect the whole marketplace."
        actions={
          <Button onClick={save} loading={saving} disabled={!state}>
            <Save className="w-3.5 h-3.5" />
            Save settings
          </Button>
        }
      />

      <ErrorNote message={error} onRetry={load} />

      {state && (
        <>
          {state.maintenanceMode && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">
                <strong>Maintenance mode is ON.</strong> The storefront shows the maintenance notice
                below to visitors. Admin access is unaffected.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <SectionHeader title="Availability" subtitle="Toggle marketplace capabilities" />
              <div className="space-y-3">
                {[
                  {
                    key: 'maintenanceMode' as const,
                    label: 'Maintenance mode',
                    hint: 'Show a maintenance notice instead of the storefront.',
                  },
                  {
                    key: 'allowNewRegistrations' as const,
                    label: 'Allow new registrations',
                    hint: 'Turn off to freeze sign-ups during an incident.',
                  },
                  {
                    key: 'allowNewListings' as const,
                    label: 'Allow new listings',
                    hint: 'Turn off to stop merchants publishing new products.',
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer"
                  >
                    <span>
                      <span className="block text-xs font-bold text-slate-800">{toggle.label}</span>
                      <span className="block text-[10px] text-slate-500">{toggle.hint}</span>
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-emerald-600 mt-0.5"
                      checked={state[toggle.key]}
                      onChange={(e) => setState({ ...state, [toggle.key]: e.target.checked })}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <Field label="Maintenance notice text">
                  <Textarea
                    rows={3}
                    value={state.maintenanceMessage}
                    onChange={(e) => setState({ ...state, maintenanceMessage: e.target.value })}
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader title="Support & storefront" />
              <div className="space-y-4">
                <Field label="Support email">
                  <Input
                    value={state.supportEmail}
                    onChange={(e) => setState({ ...state, supportEmail: e.target.value })}
                  />
                </Field>
                <Field label="Support phone">
                  <Input
                    value={state.supportPhone}
                    onChange={(e) => setState({ ...state, supportPhone: e.target.value })}
                  />
                </Field>
                <Field
                  label="Featured categories on the homepage"
                  hint="How many categories the storefront promotes."
                >
                  <Input
                    type="number"
                    value={state.featuredCategoryLimit}
                    onChange={(e) =>
                      setState({ ...state, featuredCategoryLimit: Number(e.target.value) || 12 })
                    }
                  />
                </Field>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <SectionHeader
              title="Escrow waybill pricing"
              subtitle="The single source of truth used by checkout and the order summary."
              actions={
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <Truck className="w-3.5 h-3.5" />
                  {Object.keys(shippingFees).length} entries
                </span>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(shippingFees).map(([stateName, fee]) => (
                <div
                  key={stateName}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                >
                  <span className="text-slate-600 truncate">{stateName}</span>
                  <span className="font-bold text-slate-900 shrink-0">{formatNaira(Number(fee))}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5">
              <SettingsIcon className="w-3 h-3" />
              Change these in <code className="font-mono">server/constants.ts</code> (
              <code className="font-mono">SHIPPING_FEES</code>) so the API and the client stay in
              agreement.
            </p>
          </Card>
        </>
      )}
    </div>
  );
};
