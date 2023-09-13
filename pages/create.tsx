import { useRouter } from "next/router";

import Form from "../components/Form";

const Create = () => {
  const router = useRouter();

  return (
    <>
      <div className="prose lg:prose-xl mt-10 my-10 md:px-5">
        <h1>Create new record</h1>

        <Form />
      </div>
    </>
  );
};

export default Create;
