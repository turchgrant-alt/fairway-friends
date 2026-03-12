import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  // Redirect to landing page
  navigate("/");
  return null;
};

export default Index;
