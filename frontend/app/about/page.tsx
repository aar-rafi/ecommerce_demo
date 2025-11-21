import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">About Our Platform</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Modern Microservices Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This e-commerce platform is built using a modern microservices architecture,
              demonstrating best practices in DevOps and cloud-native development.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Scalable microservices architecture</li>
                <li>Docker containerization for consistent deployments</li>
                <li>Kubernetes orchestration for production environments</li>
                <li>Real-time monitoring with Prometheus and Grafana</li>
                <li>Centralized logging with ELK Stack</li>
                <li>CI/CD pipeline with GitHub Actions</li>
                <li>API Gateway for unified service access</li>
                <li>JWT-based authentication and authorization</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Frontend</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Next.js 14 with App Router</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>shadcn/ui components</li>
                  <li>React Query for state management</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Backend Services</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Node.js with Express</li>
                  <li>Python with FastAPI</li>
                  <li>PostgreSQL database</li>
                  <li>Redis for caching</li>
                  <li>RESTful APIs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">DevOps</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Docker & Docker Compose</li>
                  <li>Kubernetes</li>
                  <li>GitHub Actions CI/CD</li>
                  <li>Prometheus monitoring</li>
                  <li>Grafana dashboards</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cloud Platform</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Google Cloud Platform (GCP)</li>
                  <li>Google Kubernetes Engine (GKE)</li>
                  <li>Cloud SQL for PostgreSQL</li>
                  <li>Cloud Load Balancing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Built for DevOps Excellence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This platform showcases modern DevOps practices including containerization,
              orchestration, monitoring, logging, and automated CI/CD pipelines. It&apos;s
              designed to be scalable, maintainable, and production-ready.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
