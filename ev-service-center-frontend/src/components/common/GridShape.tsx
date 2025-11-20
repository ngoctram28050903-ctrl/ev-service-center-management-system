import Image from "next/image";
import React from "react";

export default function GridShape() {
  return (
    // <>
    //   <div className="absolute right-0 top-0 -z-1 w-full max-w-[250px] xl:max-w-[450px]">
    //     <Image
    //       width={540}
    //       height={254}
    //       src="/images/logo/home.jpg"
    //       alt="grid"
    //     />
    //   </div>
    //   <div className="absolute bottom-0 left-0 -z-1 w-full max-w-[250px] rotate-180 xl:max-w-[450px]">
    //     <Image
    //       width={540}
    //       height={254}
    //       src="/images/logo/home.jpg"
    //       alt="grid"
    //     />
    //   </div>
    // </>
    <div className="absolute inset-0 -z-10 w-full h-full">
      <Image
        src="/images/logo/home.jpg"
        alt="background"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
