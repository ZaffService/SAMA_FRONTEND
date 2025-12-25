"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  type ImperativePanelGroupHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

/* ---------------- TYPES ---------------- */

interface ResizablePanelGroupProps extends React.ComponentPropsWithoutRef<
  typeof PanelGroup
> {
  className?: string;
}

interface ResizablePanelProps extends React.ComponentPropsWithoutRef<
  typeof Panel
> {}

interface ResizableHandleProps extends React.ComponentPropsWithoutRef<
  typeof PanelResizeHandle
> {
  withHandle?: boolean;
  className?: string;
}

/* ---------------- COMPONENTS ---------------- */

const ResizablePanelGroup = React.forwardRef<
  ImperativePanelGroupHandle,
  ResizablePanelGroupProps
>(({ className, ...props }, ref) => (
  <PanelGroup
    ref={ref}
    data-slot="resizable-panel-group"
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className,
    )}
    {...props}
  />
));
ResizablePanelGroup.displayName = "ResizablePanelGroup";

/**
 * ⚠️ IMPORTANT :
 * ref === ImperativePanelHandle
 * PAS HTMLDivElement
 */
const ResizablePanel = React.forwardRef<
  ImperativePanelHandle,
  ResizablePanelProps
>((props, ref) => <Panel ref={ref} data-slot="resizable-panel" {...props} />);
ResizablePanel.displayName = "ResizablePanel";

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) => {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </PanelResizeHandle>
  );
};

ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
