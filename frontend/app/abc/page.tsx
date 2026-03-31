"use client"

import { getHealth } from "@/lib/getapi";

export default function Abc() {
  const helloworld = 1+1;
  const helo_2 = getHealth();

  return (
    <>
    <h1 className="font-bold text-blue-500">Hello World {helloworld}</h1>
    <p>{helo_2}</p>
    </>
  )
}