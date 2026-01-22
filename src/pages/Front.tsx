import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";


const Front = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if there is a toast message in the location state
    if (location.state?.toastMessage) {
      const { toastMessage, toastType } = location.state;

      // Display the appropriate toast type using shadcn/sonner's toast function
      if (toastType === 'success') {
        toast.success(toastMessage);
      } else {
        toast(toastMessage); // Default toast
      }
    }
  }, [location.state]);
    return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-6  bg-[#121212]">
      <h1 className="text-green-500 text-3xl font-bold">circle</h1>
      <p className="text-muted-foreground text-2xl">
        Your number one app to stay connected with your circle.
      </p>
      <Link to={"/login"}><Button className="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-full">Login</Button></Link>
      <Link to={"/register"}><Button className="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-full">Register</Button></Link>
      </div>
    );
}

export default Front;