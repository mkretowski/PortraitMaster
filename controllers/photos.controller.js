const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    if (title && author && email && file) {
      // if fields are not empty...
      const fileNameLength = file.name.split('.').shift().length;
      const authorNameLength = author.length;
      if (fileNameLength > 25 || authorNameLength > 50) {
        throw new Error('Wrong input!');
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //a string consisting of at least one character before @, between @ and ., and after ., any of characters can't be whitespace or @
      const titlePattern = /[A-Za-z\s]*/g; //any string without special characters consisting of letters or spaces
      const titleMatched = title.match(titlePattern).join('');
      const emailMatched = email.match(emailPattern).join('');
      if (titleMatched.length < title.length || emailMatched.length < email.length) {
        throw new Error('Invalid characters...');
      }

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').pop().toLowerCase();
      if (!imageExtensions.includes(fileExt)) {
        throw new Error('Wrong input!');
      }
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      //const clientIp = req.ip;
      const user = requestIp.getClientIp(req);
      const voterToUpdate = await Voter.findOne({ user: user });
      if (!voterToUpdate) {
        const newVoter = new Voter({ user, votes: [photoToUpdate._id] });
        await newVoter.save();
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({ message: 'OK' });
      } else if (!voterToUpdate.votes.includes(photoToUpdate._id)) {
        voterToUpdate.votes.push(photoToUpdate._id);
        await voterToUpdate.save();
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        res.status(500).json({ message: 'Already voted for this photo' });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
