
import { Outlet } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            <div className="help-nugget-logo">
              Help<span>Nugget</span>
            </div>
          </CardTitle>
          <CardDescription className="text-center">
            Turn your content into tweet threads in under a minute
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Outlet />
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HelpNugget
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthLayout;
