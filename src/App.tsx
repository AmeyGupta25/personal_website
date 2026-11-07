import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// one page; vercel.json sends every other path here too, and it gets the "0 rows." page
const App = () => (location.pathname === "/" ? <Index /> : <NotFound />);

export default App;
