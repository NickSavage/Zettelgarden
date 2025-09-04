import React from "react";

export default function Cancel() {
  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold text-red-600">Payment Canceled</h1>
      <p>You can try subscribing again anytime.</p>
    </div>
  );
}
