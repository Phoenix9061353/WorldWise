import { useNavigate } from 'react-router-dom';
import Button from './Button';
function ButtonBack() {
  const navigate = useNavigate();
  return (
    <Button
      type='back'
      onClick={(e) => {
        //避免執行表單提交
        e.preventDefault();

        //回到上一頁
        navigate(-1);
      }}
    >
      &larr; Back
    </Button>
  );
}

export default ButtonBack;
