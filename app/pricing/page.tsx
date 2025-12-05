import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function PricingPage() {
  return (
    <Container>
      <div className="py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-medium">Pricing that respects your time</h1>
          <p className="mt-3 text-muted">Start free. Scale when your audience does.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted">
                <li>• 3 projects</li>
                <li>• Script generation</li>
                <li>• Basic uploads</li>
              </ul>
              <Button className="mt-6 w-full" variant="subtle">Start free</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted">
                <li>• Unlimited projects</li>
                <li>• Auto edit + captions</li>
                <li>• Optimizer</li>
              </ul>
              <Button className="mt-6 w-full">Get started</Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-yellow-500/8 to-amber-600/10 shadow-[0_0_40px_rgba(251,191,36,0.25),0_8px_32px_rgba(234,179,8,0.15),inset_0_1px_0_rgba(251,191,36,0.2),inset_0_-1px_0_rgba(234,179,8,0.15)] backdrop-blur-sm">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-500/10 pointer-events-none" />
            <CardHeader>
              <CardTitle className="underline decoration-amber-400 decoration-3 underline-offset-4 text-amber-200 font-semibold">Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted">
                <li>• Fastest processing</li>
                <li>• 4k availability</li>
                <li>• Access to our best services</li>
                <li>• 24/7 customer help</li>
              </ul>
              <Button className="mt-6 w-full" variant="subtle">Contact us</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}


