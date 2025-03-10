import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";

export default withApiAuthRequired(async function protectedRoute(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);

  // Access the user from the session
  const user = session?.user;

  res.status(200).json({
    protected: true,
    user,
  });
});
