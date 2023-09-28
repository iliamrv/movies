import { useRouter } from "next/router";

import Form from "../components/Form";

const Create = () => {
  const router = useRouter();

  return (
    <>
      <h1 className="text-center">Create new record</h1>
      <Form />
    </>
  );
};

export default Create;
