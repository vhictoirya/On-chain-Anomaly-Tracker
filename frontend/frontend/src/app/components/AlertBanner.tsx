import { AlertCircle, AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  timestamp: Date;
}

interface AlertBannerProps {
  alerts: Alert[];
}

const AlertBanner = ({ alerts }: AlertBannerProps) => {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    setVisibleAlerts(alerts.slice(0, 3)); // Show only the 3 most recent alerts
  }, [alerts]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Bell className="w-5 h-5 text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/50 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/50 text-green-400';
    }
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border backdrop-blur-lg shadow-lg transform transition-all duration-500 ease-in-out hover:scale-102 ${getAlertStyles(
            alert.type
          )}`}
        >
          <div className="flex items-start space-x-3">
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs opacity-75 mt-1">
                {alert.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;