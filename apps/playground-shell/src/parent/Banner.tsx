import { Info } from "lucide-react";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";

export function Banner({ actions = [], text }: { actions?: { label: string; onClick: () => void }[]; text: string }) {
  return (
    <Alert role="status">
      <Info />
      <AlertDescription className="flex flex-wrap items-center gap-2">
        <span className="flex-1">{text}</span>
        {actions.map(action => (
          <Button key={action.label} size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </AlertDescription>
    </Alert>
  );
}
