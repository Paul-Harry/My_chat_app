import Input from "../../components/input";
import Button from "../../components/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Form = ({
    isSignInPage = false,
}) => {
    const [data, setData] = useState({
        ...(!isSignInPage && {
            fullName: ''
        }),
        email: '',
        password: ''
    });
    const Navigate = useNavigate();

    const handleSubmit = async (e) => {
        console.log('data :>> ', data);
        e.preventDefault();
        const res = await fetch(`https://my-chat-app-uliy.onrender.com/api/${isSignInPage ? 'login' : 'register'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        if (res.status === 400) {
            alert('email or password incorrect');
        } else {
            const resData = await res.json();
            //console.log('data :>> ', resData);
            if (resData.token) {
                localStorage.setItem('user:token', resData.token);
                localStorage.setItem('user:detail', JSON.stringify(resData.user));
                Navigate('/');
            } 
        }

    }

    return (
        <div className="bg-light h-screen flex items-center justify-center">
            <div className="bg-light w-[600px] h-[800px] shadow-lg rounded-lg flex flex-col justify-center items-center">
                <div className="text-4xl font-extrabold">Welcome {isSignInPage && 'back'} </div>
                <div className="text-4xl font-light mb-14"> {isSignInPage ? 'Sign in to get explored' : 'Sign up to get started'} </div>
                <form className="flex flex-col items-center w-full" onSubmit={(e) => handleSubmit(e)}>
                    {!isSignInPage && <Input label="Full name" name="name" placeholder="Enter your full name" className="mb-6 w-[50%]" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} />}

                    <Input label="Email address" isRequired type="email" name="email" placeholder="Enter your email" className="mb-6 w-[50%]" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />

                    <Input label="Password" isRequired type="password" name="password" placeholder="Enter your password" className="mb-14 w-[50%]" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
                    <Button label={isSignInPage ? 'Sign in' : 'Sign up'} className="w-1/2 mb-2" type="submit" />
                </form>

                <div> {isSignInPage ? "Didn't have an account ?" : "Already have an account ?"} <span className="text-primary cursor-pointer underline" onClick={() => Navigate(`/users/${isSignInPage ? 'sign_up' : 'sign_in'}`)}>{isSignInPage ? 'Sign up' : 'Sign in'} </span></div>
            </div>
        </div>
    );
}
export default Form;