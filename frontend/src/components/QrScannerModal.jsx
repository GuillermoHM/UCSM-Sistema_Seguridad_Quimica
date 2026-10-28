import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertCircle, RefreshCw } from "lucide-react";

const REGEX_CODIGO_INSTITUCIONAL =
  /^([0-9]{2}[A-Z]{2}[0-9]{4}|[A-Z]{2}[0-9]{4})$/i;

export const QrScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [errorMsg, setErrorMsg] = useState("");
  const [iniciando, setIniciando] = useState(false);
  const scannerRef = useRef(null);
  const containerId = "qr-reader-container";

  // Detención segura de la cámara liberando el hardware de video
  const detenerCamara = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Error al detener scanner:", e);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  const handleCerrar = useCallback(async () => {
    await detenerCamara();
    setErrorMsg("");
    onClose();
  }, [detenerCamara, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelado = false;

    const iniciarCamara = async () => {
      setIniciando(true);
      setErrorMsg("");

      try {
        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          async (decodedText) => {
            const codigoLimpio = decodedText.trim().toUpperCase();

            if (REGEX_CODIGO_INSTITUCIONAL.test(codigoLimpio)) {
              await detenerCamara();
              onScanSuccess(codigoLimpio);
            } else {
              setErrorMsg(
                `El código escaneado ("${codigoLimpio}") no corresponde al formato institucional (ej. 26RQ0001).`,
              );
            }
          },
          () => {},
        );

        if (!cancelado) {
          setIniciando(false);
        }
      } catch (err) {
        if (!cancelado) {
          setIniciando(false);
          const errorTexto = String(err);
          if (
            errorTexto.includes("NotAllowedError") ||
            errorTexto.includes("Permission")
          ) {
            setErrorMsg(
              "Permiso de cámara denegado. Habilita el acceso en tu navegador.",
            );
          } else {
            setErrorMsg(
              "No se pudo acceder a la cámara o el dispositivo no cuenta con una.",
            );
          }
        }
      }
    };

    const timer = setTimeout(iniciarCamara, 100);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      detenerCamara();
    };
  }, [isOpen, detenerCamara, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-base">Escanear Código QR</h2>
          </div>
          <button
            onClick={handleCerrar}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
            title="Cerrar y apagar cámara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor de escaneo */}
        <div className="p-5 flex flex-col items-center">
          <div className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-200">
            {iniciando && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 z-10 bg-slate-900/80">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs">Iniciando cámara...</span>
              </div>
            )}
            <div id={containerId} className="w-full h-full" />
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Apunta la cámara al código QR impreso en el frasco del reactivo.
          </p>

          {errorMsg && (
            <div className="w-full mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleCerrar}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
