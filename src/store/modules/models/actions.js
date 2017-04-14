import factory from './factory.js'
import Validator from './../../utilities/validator.js'
import helpers from './helpers.js'

export default {
    initStory (context) {
        const story = new factory.Story();
        story.name = 'Story ' + (context.state.stories.length + 1);
        context.commit('initStory', {
            story: story
        });

        // set the new story as the current story
        context.dispatch('application/setCurrentStory', {
            story: story
        }, { root: true });

        // create a geometry object for the story
        context.dispatch('geometry/initGeometry', {
            story: story
        }, { root: true });
    },

    initSpace (context, payload) {
        const story = context.state.stories.find(s => s.id === payload.story.id),
            space = new factory.Space();
        space.name = 'Space ' + (story.spaces.length + 1);
        context.commit('initSpace', {
            story: story,
            space: space
        });
    },

    initShading (context, payload) {
        const story = context.state.stories.find(s => s.id === payload.story.id),
            shading = new factory.Shading();
        shading.name = 'Shading ' + (story.shading.length + 1);
        context.commit('initShading', {
            story: story,
            shading: shading
        });
    },

    destroyStory (context, payload) {
        const story = context.state.stories.find(s => s.id === payload.story.id);
        context.commit('destroyStory', {
            story: story
        });
    },

    destroySpace (context, payload) {
        const story = context.state.stories.find(s => s.id === payload.story.id),
            space = story.spaces.find(s => s.id === payload.space.id);

        context.commit('destroySpace', {
            space: space,
            story: story
        });
        const face = context.rootGetters['application/currentStoryGeometry'].faces.find(f => f.id === space.face_id);
        if (face) {
            // destroy face associated with the space
            context.dispatch('geometry/destroyFaceAndDescendents', {
                face: face,
                geometry: context.rootGetters['application/currentStoryGeometry']
            }, { root: true });
        }
    },

    destroyShading (context, payload) {
        const story = context.state.stories.find(s => s.id === payload.story.id),
            space = story.spaces.find(s => s.id === payload.shading.id);

        context.commit('destroyShading', {
            shading: shading,
            story: story
        });

        // TODO: update destroyFaceAndDescendents to work with shading
        const face = context.rootGetters['application/currentStoryGeometry'].faces.find(f => f.id === shading.face_id);
        if (face) {
            // destroy face associated with the space
            context.dispatch('geometry/destroyFaceAndDescendents', {
                face: face,
                geometry: context.rootGetters['application/currentStoryGeometry']
            }, { root: true });
        }
    },
    destroyImage (){debugger},

    // this is ONLY for library objects and does not include shading, spaces, or stories
    destroyObject (context, payload) {
        context.commit('destroyObject', {
            object: payload.object
        });
    },

    updateStoryWithData (context, payload) {
        const story = context.state.stories.find(s => s.id === payload.story.id),
            validProperties = Object.keys(story),
            cleanedPayload = {};

        // remove extra properties from the payload
        for (var key in payload) {
            if (payload.hasOwnProperty(key) && ~validProperties.indexOf(key)) {
                cleanedPayload[key] = payload[key];
            }
        }
        cleanedPayload.story = story;

        // TODO: validation
        context.commit('updateStoryWithData', cleanedPayload);
    },

    updateSpaceWithData (context, payload) {
        const space = context.rootState.application.currentSelections.story.spaces.find(s => s.id === payload.space.id),
            validProperties = Object.keys(space),
            cleanedPayload = {};

        // remove extra properties from the payload
        for (var key in payload) {
            if (payload.hasOwnProperty(key) && ~validProperties.indexOf(key)) {
                cleanedPayload[key] = payload[key];
            }
        }
        cleanedPayload.space = space;

        // TODO: validation
        context.commit('updateSpaceWithData', cleanedPayload);
    },

    updateShadingWithData (context, payload) {
        const shading = context.rootState.application.currentSelections.story.shading.find(s => s.id === payload.shading.id),
            validProperties = Object.keys(shading),
            cleanedPayload = {};

        // remove extra properties from the payload
        for (var key in payload) {
            if (payload.hasOwnProperty(key) && ~validProperties.indexOf(key)) {
                cleanedPayload[key] = payload[key];
            }
        }
        cleanedPayload.shading = shading;

        // TODO: validation
        context.commit('updateShadingWithData', cleanedPayload);
    },
    updateImageWithData (context, payload) {
        const image = context.rootState.application.currentSelections.story.images.find(i => i.id === payload.image.id),
            validProperties = Object.keys(image),
            cleanedPayload = {};

        // remove extra properties from the payload
        for (var key in payload) {
            if (payload.hasOwnProperty(key) && ~validProperties.indexOf(key)) {
                cleanedPayload[key] = payload[key];
            }
        }
        cleanedPayload.image = image;

        // TODO: validation
        context.commit('updateImageWithData', cleanedPayload);
    },

    updateObjectWithData (context, payload) {
        const object = helpers.libraryObjectWithId(context.state, payload.object.id);
        payload.object = object;
        // TODO: validation
        context.commit('updateObjectWithData', payload);
    },

    createImageForStory (context, payload) {
        const image = new factory.Image(payload.src);
        image.name = payload.name;
        image.height = (context.rootState.project.view.max_y - context.rootState.project.view.min_y) / 3;

        context.commit('createImageForStory', {
            story_id: payload.story_id,
            image: image
        });
    },

    createObjectWithType (context, payload) {
        context.commit('initObject', {
            type: payload.type,
            object: payload.object
        });
    }
}
