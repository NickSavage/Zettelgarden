import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";
import landingImage from "../assets/landing.png";
import { GithubIcon } from "../assets/icons/GithubIcon";
import { LandingHeader } from "./LandingHeader";


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
    addToMailingList(email);
    setSubmitted(true);
  }
  useEffect(() => {
    document.title = "Zettelgarden"
  }, []);

  return (
    <div className="w-full py-2 mx-auto max-w-screen-xl flex items-center">
      <div>
        <LandingHeader />
        <div className="flex gap-12 items-center">
          <div className="py-36 w-6/12">
            <p className="text-2xl">
              Plant Your Thoughts, Cultivate Your Ideas
            </p>
            <p className="text-xl">
            Zettelgarden is an open-source personal knowledge management system 
              that preserves human insight while leveraging modern technology. 
              Built on zettelkasten principles, it helps you develop and maintain 
              your own understanding of the world.
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
            <p className="font-bold">
              Thoughtful AI Integration
            </p>
            <p>
              While other tools rush to automate everything with LLMs, Zettelgarden 
              takes a measured approach. AI features are designed to augment your 
              thinking process, not replace it. Find connections and patterns while 
              maintaining the critical human element of knowledge management.
            </p>
          </div>
          
          <div className="pt-20">
            <p className="font-bold">Human-Centric Knowledge Organization</p>
            <p>
              Create and connect atomic notes that reflect your understanding, not 
              just store information. Built on time-tested zettelkasten principles, 
              Zettelgarden helps you develop genuine insights rather than just 
              collecting automated summaries.
            </p>
          </div>

          <div className="pt-20">
            <p className="font-bold">Built for Scale</p>
            <p>
              Whether you're managing personal notes or building a company 
              knowledge base, Zettelgarden is designed to grow with you. 
              Powerful linking and organization features help maintain clarity 
              even as your knowledge base expands.
            </p>
          </div>

          <div className="pt-20">
            <p className="font-bold">
              Open Source and Transparent
            </p>
            <p>
              Zettelgarden is built in the open, using TypeScript and Go, with an 
              experimental iOS app in Swift. Your knowledge belongs to you - no 
              vendor lock-in, no black boxes, just clean, efficient knowledge 
              management.
            </p>
          </div>
        </div>
        <div className="pt-36">
          <p>
          Stay updated with Zettelgarden's development. Sign up for occasional 
          updates about new features and releases.
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
