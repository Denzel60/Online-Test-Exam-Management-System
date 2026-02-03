const loginUser = (req, res) => {
  res.send('User route');
};

const createUser = (req, res) => {
    res.send('Create user');
};

const updateUser = (req, res) => {
    res.send(`Update user with id ${req.params.id}`);
}

const deleteUser = (req, res) => {
    res.send(`Delete user with id ${req.params.id}`);
}

export { loginUser, createUser, updateUser, deleteUser };