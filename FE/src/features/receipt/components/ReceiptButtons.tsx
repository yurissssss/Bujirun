type ReceiptButtonsProps = {
  onDetail?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
};

type ReceiptButtonConfig = {
  label: string;
  path: string;
  viewBox: string;
  className: string;
  onClick?: () => void;
};

export function ReceiptButtons({ onDetail, onDownload, onClose }: ReceiptButtonsProps) {
  const buttons: ReceiptButtonConfig[] = [
    {
      label: "상세보기",
      viewBox: "0 0 512 512",
      className: "bg-main-blue",
      onClick: onDetail,
      path: "M504.352,459.061l-99.435-99.477c74.402-99.427,54.115-240.344-45.312-314.746S119.261-9.277,44.859,90.15S-9.256,330.494,90.171,404.896c79.868,59.766,189.565,59.766,269.434,0l99.477,99.477c12.501,12.501,32.769,12.501,45.269,0c12.501-12.501,12.501-32.769,0-45.269L504.352,459.061z M225.717,385.696c-88.366,0-160-71.634-160-160s71.634-160,160-160s160,71.634,160,160C385.623,314.022,314.044,385.602,225.717,385.696z",
    },
    {
      label: "다운로드",
      viewBox: "0 0 24 24",
      className: "bg-sub-pink",
      onClick: onDownload,
      path: "M13.5,22.5c0,.83-.67,1.5-1.5,1.5s-1.5-.67-1.5-1.5,.67-1.5,1.5-1.5,1.5,.67,1.5,1.5Zm3.5-1.5c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Zm5,0c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Zm-15,0c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Zm-5,0c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Zm14.96-9.58l-3.46,3.33V1.5c0-.83-.67-1.5-1.5-1.5s-1.5,.67-1.5,1.5V14.75l-3.46-3.33c-.6-.58-1.55-.56-2.12,.04-.57,.6-.56,1.55,.04,2.12l4.56,4.39c.66,.66,1.54,1.03,2.48,1.03s1.81-.36,2.45-1.01l4.59-4.41c.6-.57,.62-1.52,.04-2.12s-1.53-.62-2.12-.04Z",
    },
    {
      label: "닫기",
      viewBox: "0 0 512 512",
      className: "bg-sub-gray",
      onClick: onClose,
      path: "M301.258,256.01L502.645,54.645c12.501-12.501,12.501-32.769,0-45.269c-12.501-12.501-32.769-12.501-45.269,0l0,0 L256.01,210.762L54.645,9.376c-12.501-12.501-32.769-12.501-45.269,0s-12.501,32.769,0,45.269L210.762,256.01L9.376,457.376 c-12.501,12.501-12.501,32.769,0,45.269s32.769,12.501,45.269,0L256.01,301.258l201.365,201.387 c12.501,12.501,32.769,12.501,45.269,0c12.501-12.501,12.501-32.769,0-45.269L301.258,256.01z",
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={button.onClick}
          aria-label={button.label}
          className={`flex size-5 cursor-pointer items-center justify-center rounded-full text-main-white transition-transform duration-150 hover:scale-125 active:scale-110 ${button.className}`}
        >
          <svg viewBox={button.viewBox} className="size-2.5 fill-current" aria-hidden="true">
            <path d={button.path} />
          </svg>
        </button>
      ))}
    </div>
  );
}
