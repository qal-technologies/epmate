import { useFlow } from '../flows/core/FlowInstance';
import FlowState, { useFlowState } from '../flows/core/FlowState';
import { useFlowApi } from '../flows/hooks/useFlowApi';
import SplashScreen from '../screens/SplashScreen';
import { Text } from 'react-native-paper';

const FlowNav: React.FC = () => {
  const flow = useFlow();
  const Flow = flow.create('page');
  const Child = flow.create('child');
  
  return (
    <Flow name="Auth" shareState >
      <Flow.FC name="Signup" page={<Test2 />} size="bottom" />
      <Flow.FC name="Login" page={<Test1 />} size="full" />
      <Flow.FC name="Test2" page={<Test2 />} size="half" />
    </Flow>
  );
};

const Test1 = () => {
  return <Text>Screen 2</Text>;
};

const Test2 = () => {
  return <Text>Screen 3</Text>;
};

export default FlowNav;