import { Suspense } from 'react'
import SignUp from '@/components/SignUp'

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUp />
    </Suspense>
  )
}
