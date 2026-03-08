import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface Props {
  title: string;
  description?: string;
}

export function PlaceholderSection({ title, description }: Props) {
  return (
    <Card className="border-border rounded-xl">
      <CardContent className="py-12 text-center">
        <Construction className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {description || "Esta seção será implementada em breve. Fique ligado!"}
        </p>
      </CardContent>
    </Card>
  );
}
