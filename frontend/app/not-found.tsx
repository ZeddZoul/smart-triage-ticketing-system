import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="mx-auto w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-5xl font-bold text-muted-foreground">
            404
          </CardTitle>
          <CardDescription className="text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard">Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
