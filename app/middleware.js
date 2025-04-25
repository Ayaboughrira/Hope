import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const userType = req.nextauth?.token?.user?.type;
    
    // Routes limitées aux associations
    if (pathname.startsWith("/my-shelters") && userType !== "association") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }
    
    // Routes limitées aux vétérinaires
    if (pathname.startsWith("/my-services") && userType !== "veterinaire") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

export const config = {
  matcher: ["/profile", "/my-animals", "/my-donations", "/my-shelters", "/manage-adoptions", "/my-services"],
};