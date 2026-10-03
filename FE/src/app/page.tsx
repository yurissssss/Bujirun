import HomePage from "./home/page";

export default function Home() {
  return <HomePage />;
}

// "use client";

// import { useState, useEffect } from "react";
// import { FeaturePlaceholder } from "@/components";

// export default function Home() {
//   const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

//   useEffect(() => {
//     // localStorage는 클라이언트에서만 접근 가능해서 불가피하게 useEffect 사용 (임시 코드)
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     setIsLoggedIn(!!localStorage.getItem("accessToken"));
//   }, []);

//   if (isLoggedIn === null) return null;

//   return (
//     <div>
//       {isLoggedIn ? (
//         <FeaturePlaceholder title="홈 탭입니다. (로그인됨)" />
//       ) : (
//         <FeaturePlaceholder title="로그인이 필요합니다" />
//       )}
//     </div>
//   );
// }
