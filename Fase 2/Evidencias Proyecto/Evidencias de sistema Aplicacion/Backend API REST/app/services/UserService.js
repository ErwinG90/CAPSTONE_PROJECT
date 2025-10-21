const UserRepository = require('../repositories/UserRepository');

class UserService {

    async save(userDTO) {
        console.info(`${new Date().toISOString()} [UserService] [save] [START] Save [${JSON.stringify(userDTO)}]`);
        // Implementation to save userDTO

        const userRepository = new UserRepository();
        await userRepository.save(userDTO);

        console.info(`${new Date().toISOString()} [UserService] [save] [END] Save`);
    }

    async findAll() {
        console.info(`${new Date().toISOString()} [UserService] [findAll] [START] Find All`);
        const userRepository = new UserRepository();
        const users = await userRepository.findAll();
        console.info(`${new Date().toISOString()} [UserService] [findAll] [END] Find All [${users.length}]`);
        return users;
    }

    async findByUid(uid) {
        console.info(`${new Date().toISOString()} [UserService] [findByUid] [START] uid=${uid}`);
        const userRepository = new UserRepository();
        const user = await userRepository.findByUid(uid);
        console.info(`${new Date().toISOString()} [UserService] [findByUid] [END] ${user ? 'FOUND' : 'NOT_FOUND'}`);
        return user;
    }

    async update(uid, partialData) {
        console.info(`${new Date().toISOString()} [UserService] [update] [START] uid=${uid}`);
        const userRepository = new UserRepository();
        const updated = await userRepository.update(uid, partialData);
        console.info(`${new Date().toISOString()} [UserService] [update] [END] ${updated ? 'OK' : 'NOT_FOUND'}`);
        return updated;
    }


}

module.exports = UserService;