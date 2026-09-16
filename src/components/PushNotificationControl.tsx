import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPushConfig, savePushSubscription } from "@/lib/push.functions";
import { arrayBufferToBase64Url, isStandaloneApp, registerSportsServiceWorker, supportsWebPush, urlBase64ToUint8Array } from "@/lib/push.browser";

type PushState = "checking" | "available" | "enabled" | "blocked" | "unsupported" | "error";

export function PushNotificationControl() {
  const getConfig = useServerFn(getPushConfig);
  const saveSubscription = useServerFn(savePushSubscription);
  const [state, setState] = useState<PushState>("checking");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    let active = true;
    setStandalone(isStandaloneApp());
    if (!supportsWebPush()) { setState("unsupported"); return; }
    void (async () => {
      try {
        const [{ publicKey: key }, registration] = await Promise.all([getConfig(), registerSportsServiceWorker()]);
        if (!active) return;
        setPublicKey(key);
        const existing = await registration?.pushManager.getSubscription();
        if (!active) return;
        if (existing && Notification.permission === "granted") setState("enabled");
        else if (Notification.permission === "denied") setState("blocked");
        else setState("available");
      } catch { if (active) setState("error"); }
    })();
    return () => { active = false; };
  }, [getConfig]);

  async function enable() {
    if (!supportsWebPush() || !publicKey) { setState("error"); return; }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "blocked" : "available"); return; }
      const registration = await registerSportsServiceWorker();
      if (!registration) throw new Error("Service worker indisponível.");
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await saveSubscription({ data: { endpoint: subscription.endpoint, p256dh: arrayBufferToBase64Url(subscription.getKey("p256dh")), auth: arrayBufferToBase64Url(subscription.getKey("auth")), userAgent: navigator.userAgent } });
      setState("enabled");
    } catch { setState("error"); } finally { setBusy(false); }
  }

  if (state === "checking") return <div className="panel mt-4 flex items-center gap-3 p-4 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" aria-hidden />Verificando notificações…</div>;
  if (state === "enabled") return <div className="panel mt-4 flex items-start gap-3 border-success/25 p-4" role="status"><Bell className="mt-0.5 size-5 text-success" aria-hidden /><div><p className="text-sm font-medium">Notificações ativadas</p><p className="mt-1 text-xs text-muted-foreground">Este navegador pode receber atualizações esportivas do sistema.</p></div></div>;
  if (state === "blocked") return <div className="panel mt-4 flex items-start gap-3 p-4" role="status"><BellOff className="mt-0.5 size-5 text-muted-foreground" aria-hidden /><div><p className="text-sm font-medium">Notificações bloqueadas</p><p className="mt-1 text-xs text-muted-foreground">Libere as notificações nas configurações do navegador ou do sistema para receber avisos.</p></div></div>;
  if (state === "unsupported") return <div className="panel mt-4 flex items-start gap-3 p-4" role="status"><Smartphone className="mt-0.5 size-5 text-muted-foreground" aria-hidden /><div><p className="text-sm font-medium">Avisos não disponíveis neste navegador ou modo</p><p className="mt-1 text-xs text-muted-foreground">Use um navegador atualizado; em alguns dispositivos o app precisa estar instalado na Tela de Início.</p></div></div>;

  return <div className="panel mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" role={state === "error" ? "alert" : undefined}><div className="flex items-start gap-3"><Bell className="mt-0.5 size-5 text-primary" aria-hidden /><div><p className="text-sm font-medium">Receber atualizações esportivas</p><p className="mt-1 text-xs text-muted-foreground">{standalone ? "Ative uma vez para receber avisos deste app." : "Ative as notificações neste navegador."}</p>{state === "error" && <p className="mt-1 text-xs text-warning">Não foi possível preparar os avisos agora.</p>}</div></div><Button className="min-h-11" onClick={() => void enable()} disabled={busy || !publicKey}>{busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : <Bell className="mr-2 size-4" aria-hidden />}Ativar notificações</Button></div>;
}
