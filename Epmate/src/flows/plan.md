build a flow engine that handles flow like water:

the concept is of two types modalFlow and pageFlow:
all uses provider that wraps the elements and the provider has the type prop that takes in either modal or page.

==> modalFlow: use with a modal parent to wrap all children in it, and render them inside the modal.
each child page specifies size, onclose, ondrag, draggable and other things as we expland.
something like this:
const Flow = useFlow().create();
this returns the component that wraps and iterate through the children.
createMethod can also take in optional parameters like:
const Flow = useFlow().create('modal') or .create('page') or .create('child')

this automatically returns the flow with the type omitted (the specified parameter type is used) but still needs naming:
<Flow name='ANameYouWant'></Flow>
naming is important for categorizing elements and fetching the right one.
the child props this power so you can create function components without having to add flow wrap for just a single element, it still needs all data sent to the <Flow.FC> but takes some parent props like type, restrictions;
under the hood this indirectly wraps the element with a Flow and the name from the prop is also named with the parent.
no child of the same parent can have the same name.
it takees all the Flow child prop and works fine for faster nesting, so you don't need to wrap a flow parent first before adding pages.

if a flow component is placed in a blank parent or page: if it is a modal, and not set to full, it doesnt take up the page and the blank places stays behind. if to use in a blank background make modal size to full or use page type instead.

flow component doesnt remove the underlying or negbouring elements, it overlays them.
use a very high zindex or a technique to make sure it stays at the top.

flow would have hooks soon, coz the zindex might obstruct other alert libraries.

<Flow type='modal' name='Auth' isRestrictedIn={isLoggedIn} isRestrictedOut={!isLoggedIn} shareState theme='white || black'> 
//or page if you want it to be full screen and no draggable options and dismissible options
//this houses the screen as pages and are rendered as arranged here:

flow wraps all inner component with a function component, that where the `Flow.FC` comes from and making it similar to react/react native.

//size: this tells the parent on how to align the child and takes in full, half, bottom.
This specifies the onOpen height of the modal when rendered and can change if draggable is true (it can be dragged to full or to bottom).
//// options of the size: 1. full: 'takes the 'whole height of the viewport'; half:'takes half of the viewport height'; bottom: 'stays at the bottom on render but if draggable is set it can be enlarged to increase';
flows can be added inside any react native element even buttons, but doesnt maintain the size of that element as the size properties is relative to the device width and hieight.
page types are always full and no draggable.

all flow parents has title and closeButton boolean and even ability to add an element as close button, it has the canGoback options for back button visiblity to child

<Flow.FC size='full' draggable dismissable dragging onDrag switching onSwitch opening onOpen shouldSwitch retract title='Signup' noTitle canGoBack={false} page={<ThisIsAnElement/>} extras={...anyStateThatisNotSavedInTheFlowState}name='AnyNameForRoutingAndNavigation' background={'addTheColorYouWantButCantBeTransparent'|| 'defaultsToWhiteOrBlackBaseOntheme'}/>
</Flow>

size has been explained;
draggable: only present in modal typed flow parent. it makes the element draggable to top or bottom. but cant cover the child title(if child specifies) or the dragging knob on the modal element. Full sized modals can still be dragged down and back up
dragging: returns true onPress in and move of the modal - can be used with useEffect to monitor when a page or modal is being dragged and make an action. and can set the draggable to true or false if it is what you want.
dismissable: this is a boolean and when set to false, the touching outside the modal doesnt close it. on default it is true.
onDrag: a function, but returns number on drag of the modal. these numbers can be used for mathematical purposes or even rendering animations and others. it can still be used for calling functions that should be done when the modal is being dragged.
switching: returns true if the modal or page is switching out. (going either forward or backward) this switching is triggered internally.
onSwitching: returns 'forward' or 'backward' depending on what the child is doing and can call functions that resolves before the switch is complete. if this function fails, the element doesnt switch.
opening: returns true if a page has been switched to. this switching is externally either by the parent or the siblings.
onOpen: returns 'parent' or 'sibling' depending on who opened it and can call functions that resolves before page fully opens. if the onOpen function fails the element returns to the element that called it.

for onSwitching: the intended function should be called and if it suceeds, the switch function is called.
if the onOpen is called, add a after load parameter, which loads the component first then call the function. if this fails, it doesnt go back.

shouldSwitch: is a boolean that is always true on pages, but if set to false, the child cannot switch both forward or backward, up or down. this is equivalent to the isRestricted prop of the parent.
this can be used to stop the back button operation while a load or action is happening.

retract: is a modal prop that takes the modal back to the size height immediately the press is taken off.

title is the name above the pages or modal, if absent the name is used as fallback.
noTitle removes the title from the page, can be used in parent flow too.

canGoBack is set to true by default, but if set to false, components and pages cant move backwards or up (if they were navigated down).

page: takes the element and wraps in <></> to retain the elements style and everything.
this must be defined.

extras: houses any state that wasnt set using flowState (things like external links, reoccuring or fastFetch data, or database fetch data).
extras are always monitored and updated onces new data changes.

name:'takes the call name of the page. this name is used by siblings and parent to route to that page easily'. cannot be absent.

background: tells the color of the page, can pass in theme to parent and all child takes it too. they repsond to device theme is not set (white in light mode and black in darkmode).

all the props can be also accessible by child and can also be sent to parent using state props.

Flows can be nested like a type page flow having a modal inside and likewise.
a flow back button and even the mobile back button triggers the prev() internal method, which iterates through the page in each flow parent. if the inner child triggers a back button and it is the index 0 of its parent, it leaps and goes up to the nearest previous parent, and same goes to triggering the next button in an inner child.
the restrictIn and restrictOut prop of the flow parent stops entrance or leaving from both the child element and the surrounding siblings.

Examples:
const Flow = useFlow();
const Parent = Flow.create('page');
const Modal = useFlow().create('modal').name('Questions');

const [allChildData, setData] = useState(null);
const State = Flow.state() ; // or you can: useFlowState();
const fectCartData = ()=>{
fetch(....).then(data=>{
const sharedData = State.set('cartData', {...data});
setData(sharedData)
})
}

<Parent name='Users' shareState={sharedData}>
<Parent.FC name='Home' page={insideElement}/>
<Parent.FC name='Cart' page={insideElement2} onOpen={()=>fetchCartData} extra={sharedData}/>
<Parent.FC name='Cart' page={insideElement3}>
<Modal page={insideElement4} draggable size='half'/>//name already assigned
</Parent.FC>
</Parent>

shareState: provides the data shared by each child to one another. default is true and if it is false, every child data is temporary and routing out clears the data from the state store.
this is necessary to protected store data and safety too.

isRestrictedIn: stops any routing to come into the parent or any of the child, except the check for the restriction is lifted.
isRestrictedOut: the elements can't switch out from their parent unless the check is false.
theme: handles the color of the page and takes in color, default is white for light mode and black for darkmode.

this flow library has in-page state handling and relies on class private stores for the flow and redux state store for wider app storage, each data can be added, removed, changed or even updated by ussing the state hook.

you can navigate with the useSwitch hook to only pages within a flow parent.

example:
useFlowState() hook or the useFlow().state(), does the same thing.
each child automatically gets the parent's state as a prop, and can be accessed
if you use useFlowState(state), the state access is limited to that state array or object.
this is necessary for data security and changes. a name key may occur in may places in the store, so narrowing down to a state object is better for easy data access.

const state = useFlowState();
const name = state.get('name')
<Text>{name}</Text>
this searches the whole store for a name key and returns the value, but what if you need to check if name is there or a data check:
const exactUserData = state.get('user', ['email']);
this checks if name is an object and gets the email, if exists but no email, it returns undefined;
if user isnt an object, return the vaue of user.
state.search('name', 'john wilson');
returns the match;
state.send('dataKeyName', {..data}, 'to', 'payment');
only the child with name payment can access this data, returns null to other chid that tries to access it.
the to can be: 'hide': that page cant see it.

state.take('otp'), returns the data but removes it from the store.
state.keep('typingSpeed', {100}), saves the data temporarily and is removed from the store once the page is switched.
state.setCat('interactions', 'playedAudio', {today: true}); this adds the state to a category and can access that state only in that category; adding secure after the data makes the data locked until the key is matched, something like this:
state.setCat('interactions', 'hisLocation', {today: 'western City'}, 'secure':'aKeyInHere');
this key can be hardCoded or even fetched, dynamic or static and the data can only be retrieved if the saved key is correct.
getting catData: state.getCat('interactions', 'playedAudio').today;
getting secured catData: state.getCat('interactions', 'hisLocation').today //returns null;
getting secured catData: state.getCat('interactions', 'hisLocation', 'aKeyInHere').today //returns western City;

let's work with this for now to make this work.