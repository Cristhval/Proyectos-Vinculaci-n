import { forwardRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { RECAPTCHA_SITE_KEY } from '@/config/api'

interface Props {
  onChange: (token: string | null) => void
}

/** Casilla reCAPTCHA v2 "No soy un robot". El token caduca a los 2 minutos: se limpia al expirar. */
const CaptchaField = forwardRef<ReCAPTCHA, Props>(function CaptchaField({ onChange }, ref) {
  return (
    <div className="min-h-[78px]">
      <ReCAPTCHA
        ref={ref}
        sitekey={RECAPTCHA_SITE_KEY}
        hl="es-419"
        onChange={onChange}
        onExpired={() => onChange(null)}
        onErrored={() => onChange(null)}
      />
    </div>
  )
})

export default CaptchaField
