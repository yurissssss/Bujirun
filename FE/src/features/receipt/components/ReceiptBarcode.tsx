type ReceiptBarcodeProps = {
  value: string;
};

export function ReceiptBarcode({ value }: ReceiptBarcodeProps) {
  return (
    <div className="relative mx-10">
      <div
        className="h-8 w-full"
        style={{
          background: `repeating-linear-gradient(
        90deg,
        var(--color-text-receipt-main) 0px,    var(--color-text-receipt-main) 2px,
        transparent  2px,  transparent  5px,
        var(--color-text-receipt-main) 5px,    var(--color-text-receipt-main) 6px,
        transparent  6px,  transparent  9px,
        var(--color-text-receipt-main) 9px,    var(--color-text-receipt-main) 12px,
        transparent  12px, transparent 14px,
        var(--color-text-receipt-main) 14px,   var(--color-text-receipt-main) 15px,
        transparent  15px, transparent 18px,
        var(--color-text-receipt-main) 18px,   var(--color-text-receipt-main) 21px,
        transparent  21px, transparent 23px,
        var(--color-text-receipt-main) 23px,   var(--color-text-receipt-main) 24px,
        transparent  24px, transparent 27px,
        var(--color-text-receipt-main) 27px,   var(--color-text-receipt-main) 29px,
        transparent  29px, transparent 31px,
        var(--color-text-receipt-main) 31px,   var(--color-text-receipt-main) 34px,
        transparent  34px, transparent 36px,
        var(--color-text-receipt-main) 36px,   var(--color-text-receipt-main) 37px,
        transparent  37px, transparent 40px,
        var(--color-text-receipt-main) 40px,   var(--color-text-receipt-main) 42px,
        transparent  42px, transparent 44px,
        var(--color-text-receipt-main) 44px,   var(--color-text-receipt-main) 47px,
        transparent  47px, transparent 49px,
        var(--color-text-receipt-main) 49px,   var(--color-text-receipt-main) 50px,
        transparent  50px, transparent 54px
      )`,
        }}
      />
      <p className="mt-1 select-none text-center font-bold">{value}</p>
    </div>
  );
}
