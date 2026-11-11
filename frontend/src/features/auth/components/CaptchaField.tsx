import { forwardRef, useEffect, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { Check, ShieldCheck } from 'lucide-react'
import { RECAPTCHA_SITE_KEY } from '@/config/api'

interface Props {
  value?: string | null
  onChange: (token: string | null) => void
}

/** Casilla reCAPTCHA v2 "No soy un robot". El token caduca a los 2 minutos: se limpia al expirar. */
const CaptchaField = forwardRef<ReCAPTCHA, Props>(function CaptchaField({ value, onChange }, ref) {
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    setVerificado(Boolean(value))
  }, [value])

  const handleChange = (token: string | null) => {
    setVerificado(Boolean(token))
    onChange(token)
  }

  const limpiar = () => {
    setVerificado(false)
    onChange(null)
  }

  return (
    <div className="rounded-btn border border-line bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          verificado ? 'bg-emerald-100 text-emerald-600' : 'bg-bg-soft text-ink-light'
        }`}>
          {verificado ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink">
            {verificado ? 'Verificación completada' : 'Verificación de seguridad'}
          </p>
          <p className={`mt-0.5 text-[11px] ${verificado ? 'text-emerald-600' : 'text-ink-muted'}`}>
            {verificado ? 'Puedes continuar.' : 'Confirma que no eres un robot.'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex min-h-[78px] w-full items-center justify-center overflow-hidden">
        <div className="h-[78px] w-[304px] shrink-0">
          <ReCAPTCHA
            ref={ref}
            sitekey={RECAPTCHA_SITE_KEY}
            hl="es-419"
            onChange={handleChange}
            onExpired={limpiar}
            onErrored={limpiar}
          />
        </div>
      </div>
    </div>
  )
})

export default CaptchaField
