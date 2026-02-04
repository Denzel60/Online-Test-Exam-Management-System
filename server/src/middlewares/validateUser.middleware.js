im

const validateUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;


        next();
    } catch (error) {
        console.error("Validation error:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
}

export default validateUser;