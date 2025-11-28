export default function formatPrice ( price: number | string, currency: string = '₦' ) {
    const numPrice = typeof price === 'string' ? parseFloat( price.replace( /,/g, '' ) ) : price;

    if ( isNaN( numPrice ) ) return `${ currency }0`;

    const formatted = new Intl.NumberFormat( 'en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    } ).format( numPrice );

    return `${ currency }${ formatted }`;
}