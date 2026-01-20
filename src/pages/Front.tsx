import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Front = () => {
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