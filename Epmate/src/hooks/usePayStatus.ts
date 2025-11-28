import { useEffect, useState } from "react";

const usePayStatus = () => {
    const [ status, setStatus ] = useState<boolean | null>( null );
    const [ loading, setLoading ] = useState( true );
    const [ errorMessage, setMessage ] = useState<string |null>(null);

    useEffect( () => {
        const timer = setTimeout( () => {
            setStatus( true );
            setLoading( false );
            if ( status === false ) {
                setMessage( 'Payment failed because of something' );
            }
        }, 6000 );
        return () => clearTimeout( timer );
    }, [] );

    return { status, loading, errorMessage };
};

export default usePayStatus;