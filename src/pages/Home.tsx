const Home = () => {
  const user = localStorage.getItem("user");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-6  bg-[#121212]">
      <h1 className="text-green-500 text-3xl font-bold">circle</h1>

      {user && (
        <p className="text-muted-foreground">
          Welcome back, {JSON.parse(user).username}
        </p>
      )}
    </div>
  );
};

export default Home;
