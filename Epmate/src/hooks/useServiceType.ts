import { useSelector } from "react-redux";


const useTaskName = () => {
    const { serviceType } = useSelector( ( state: any ) => state.order );
    let taskType;
    switch ( serviceType ) {
        case 'pickup':
            taskType = 'Pickup and Deliver';
            break;
        case 'buy':
            taskType = 'Buy and Deliver';
            break;
        default:
            taskType = 'Service';
            break;
    };

    return taskType;
};

export default useTaskName;