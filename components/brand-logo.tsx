type BrandLogoProps = {
    showName?: boolean;
    className?: string;
};

export function BrandLogo({
                              showName = true,
                              className = "",
                          }: BrandLogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img
                src="/favicon.svg"
                alt="DECO"
                className="size-9 shrink-0"
            />

            {showName && (
                <span className="text-2xl font-black tracking-[-.07em]">
          DECO
        </span>
            )}
        </div>
    );
}