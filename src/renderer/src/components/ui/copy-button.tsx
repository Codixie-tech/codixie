import { Button, type ButtonProps } from "@/components/ui/button";

const CopyButton = (props: Partial<ButtonProps>) => {
  return (
    <Button type="button" {...props}>
      <i className="ri-clipboard-line ri-lg" />
    </Button>
  );
};

export default CopyButton;
