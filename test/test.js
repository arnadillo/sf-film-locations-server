const app = require('../index').app;
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect
const _ = require('lodash');

chai.use(chaiHttp);
chai.should();

const locationResponseSuccess = _.clone(require('./fixtures/locationsResponseSuccess.json'));

describe('Server unit tests' , () => {

    it('should test sample /status check', (done) => {
        chai.request(app)
        .get('/status')
        .end((err, res) => {
            res.should.have.status(200);
            expect(res.text).to.equal('OK');
            done();
         });
    });

    it('should return a formatted response of locations for a queried movie title', (done) => {
        chai.request(app)
        .get('/locations')
        .query({ title: 'Venom' })
        .end((err, res) => {
            res.should.have.status(200);
            expect(res.body).to.deep.equal(locationResponseSuccess);
            done();
         });
    });

    describe('Geocoding tests', () => {

        it('should return lat and lng of a successfully geocoded address', (done) => {
            require('../index').geocodeAddress('Golden Gate Bridge').then((coordinates) => {
                expect(coordinates).to.have.property('lat');
                expect(coordinates).to.have.property('lng');
                done();
            });
        });

        it('should return undefined when geocoding yields no results', (done) => {
            require('../index').geocodeAddress('I don\'t exist').then((coordinates) => {
                expect(coordinates).to.equal(undefined);
                done();
            });
        });
    });

});