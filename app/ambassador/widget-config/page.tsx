import { WidgetIntegration } from '@/components/ambassador/widget-integration';

// type WidgetConfigPageProps = {
//   ambassadorId: string;
//   widgetTheme: string;
//   primaryColor: string;
//   position: string;
//   triggerText: string;
//   autoDetect: boolean;
// };

const WidgetConfigPage = () => {
  return (
    <div className="p-4 m-4">
      <WidgetIntegration
      //   ambassadorId={ambassadorId}
      //   theme={widgetTheme}
      //   primaryColor={primaryColor}
      //   position={position}
      //   triggerText={triggerText}
      //   autoDetect={autoDetect}
      />
    </div>
  );
};

export default WidgetConfigPage;
