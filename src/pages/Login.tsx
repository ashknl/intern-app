import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
  const { login, getSecurityQuestion, verifySecurityAnswer } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)
    const ok = await login(username, password)
    setLoading(false)

    if (!ok) {
      setError('Invalid username or password.')
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    if (!username.trim()) {
      setError('Please enter your username first.')
      return
    }

    setLoading(true)
    const result = await getSecurityQuestion(username.trim())
    setLoading(false)

    if (result.success && result.question) {
      setSecurityQuestion(result.question)
      setForgotMode(true)
    } else {
      setError(result.error ?? 'User not found.')
    }
  }

  const handleVerifyAnswer = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!answer.trim()) {
      setError('Please enter your answer.')
      return
    }

    setLoading(true)
    const ok = await verifySecurityAnswer(username.trim(), answer)
    setLoading(false)

    if (!ok) {
      setError('Incorrect answer.')
    }
    // if ok, auth context sets isAuthenticated = true → redirect
  }

  const handleBackToLogin = () => {
    setForgotMode(false)
    setAnswer('')
    setError(null)
  }

  if (forgotMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Answer your security question to log in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyAnswer} className="space-y-4">
              <Field>
                <FieldLabel>Security Question</FieldLabel>
                <p className="text-sm font-medium bg-muted/50 rounded-xl px-3 py-2">{securityQuestion}</p>
              </Field>
              <Field>
                <FieldLabel>Your Answer</FieldLabel>
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  autoFocus
                />
              </Field>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button variant="link" type="button" className="w-full" onClick={handleBackToLogin}>
                Back to login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Intern App</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
            <Button
              variant="link"
              type="button"
              className="w-full"
              disabled={loading}
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
