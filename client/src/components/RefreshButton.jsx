// src/components/RefreshButton.jsx
import { useState } from "react";
import { Button, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export const RefreshButton = ({
  onRefresh,
  size = "middle",
  style = {},
  tooltip = "Refresh data",
  label = "",
}) => {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <Tooltip title={tooltip}>
      <Button
        icon={
          <ReloadOutlined
            spin={spinning}
            style={{ transition: "transform 0.3s" }}
          />
        }
        onClick={handleRefresh}
        size={size}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          ...style,
        }}
      >
        {label && <span>{label}</span>}
      </Button>
    </Tooltip>
  );
};