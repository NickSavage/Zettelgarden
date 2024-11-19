import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import landingImage from "../assets/landing.png";
import { GithubIcon } from "../assets/icons/GithubIcon";

import { addToMailingList } from "../api/users";

function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSignUp() {
    navigate("/app");
  }

  async function handleSubmit() {
    console.log(email);
    addToMailingList(email)
    setSubmitted(true);
  }
  useEffect(() => {}, []);

  return (
    <div className="w-full py-2 mx-auto max-w-screen-xl flex items-center">
      <div>
        <div className="flex items-center">
          <Link to="/" className="mr-2">
            <img src={logo} alt="Company Logo" className="logo rounded-md" />
          </Link>
          <span className="text-2xl">Zettelgarden</span>
          <div className="flex-grow">
            <a href="#features" className="p-4">
              <span className="text-1xl">Features</span>
            </a>
          </div>
          <div className="flex-shrink">
            <Link to="/app">
              <span className="text-1xl">Login</span>
            </Link>
          </div>
        </div>
        <div className="flex gap-12 items-center">
          <div className="py-36 w-6/12">
            <p className="text-2xl">
              Plant Your Thoughts, Cultivate Your Ideas
            </p>
            <p className="text-xl">
              Zettelgarden is your dynamic 'second brain,' seamlessly blending
              task management with knowledge curation through the zettelkasten
              method.
            </p>

            <button onClick={handleSignUp} type="submit">
              Sign Up For Zettelgarden
            </button>
          </div>
          <div className="w-6/12">
            <img
              src={landingImage}
              alt="Zettelgarden interface preview"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>

        <div id="features" className="text-lg">
          <div className="pt-20">
            <p className="font-bold">Atomic Card System</p>
            <p>
              Break down your thoughts and tasks into manageable, atomic units
              with our intuitive card system. Each card holds a single piece of
              information or task, helping you focus on the essentials and
              maintain clarity in your knowledge ecosystem.
            </p>
          </div>

          <div className="pt-20">
            <p className="font-bold">Dynamic Linking and File Attachment</p>
            <p>
              Enhance your cards with the ability to upload and attach files,
              creating comprehensive nodes of information. Effortlessly build a
              rich network by linking cards and their associated files, enabling
              you to seamlessly integrate and organize diverse content.
            </p>
          </div>

          <div className="pt-20">
            <p className="font-bold">
              Integrated Task and Knowledge Management
            </p>
            <p>
              Seamlessly blend short-term tasks with long-term knowledge
              storage. Zettelgarden’s dual-focused approach ensures that your
              immediate to-dos and evolving ideas coexist harmoniously,
              providing you a comprehensive personal management solution that
              adapts as you do.
            </p>
          </div>
        </div>
        <div className="pt-36">
          <p>
            We're excited to announce that Zettelgarden is launching soon! Sign
            up for our mailing list to receive the latest updates and be the
            first to know.
          </p>
          {!submitted ? (
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <button onClick={handleSubmit} type="submit">
                Sign Up
              </button>
            </div>
          ) : (
            <p>Thank you for signing up!</p>
          )}
        </div>
        <div className="flex pt-20">
          <div className="grid text-sm">
            <Link to="">Terms of Service</Link>
            <Link to="">Privacy Policy</Link>
          </div>
          <div className="flex-grow"></div>
          <div>
            <a href="https://github.com/NickSavage/Zettelgarden">
              <GithubIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
