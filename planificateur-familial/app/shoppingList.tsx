import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { router } from 'expo-router';

  type ShoppingItem = {
    name: string;
    quantity: string;
    isBought: boolean;
  };
  
  
  export default function ShoppingListApp() {
    const [itemName, setItemName] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const docRef = doc(FIREBASE_FIRESTORE, 'shoppingLists', 'famille123');
  
    const [listId, setListId] = useState<string>('famille123'); // ID unique de la liste collaborative
  
    useEffect(() => {
      loadShoppingList();
    }, []);

    useEffect(() => {
        if (shoppingList.length > 0) {
          saveShoppingList();
        }
      }, [shoppingList]);
  
    const loadShoppingList = () => {
      const listRef = doc(FIREBASE_FIRESTORE, 'shoppingLists', listId);
      const unsubscribe = onSnapshot(listRef, (doc) => {
        if (doc.exists()) {
          setShoppingList(doc.data().items || []);
        } else {
          console.error('Liste introuvable');
        }
      });
  
      return unsubscribe;
    };
  
    const saveShoppingList = async () => {
        const listRef = doc(FIREBASE_FIRESTORE, 'shoppingLists', listId);
      
        try {
          // Vérifie si le document existe
          const docSnap = await getDoc(listRef);
          if (docSnap.exists()) {
            // Met à jour un document existant
            await updateDoc(listRef, { items: shoppingList });
          } else {
            // Crée un nouveau document si nécessaire
            await setDoc(listRef, { items: shoppingList });
          }
          console.log('Liste sauvegardée avec succès.');
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de la liste', error);
        }
    };
  
    const addItem = () => {
        if (itemName.trim().length > 0 && quantity.trim().length > 0) {
          const newItem = { name: itemName, quantity, isBought: false };
          const updatedList = [...shoppingList, newItem];
          setShoppingList(updatedList); // La sauvegarde sera déclenchée par useEffect
          setItemName('');
          setQuantity('');
          setModalVisible(false);
        }
      };
  
    const toggleBoughtStatus = (index: number) => {
      const updatedList = [...shoppingList];
      updatedList[index].isBought = !updatedList[index].isBought;
      setShoppingList(updatedList);
      saveShoppingList();
    };
  
    const deleteItem = (index: number) => {
      const updatedList = [...shoppingList];
      updatedList.splice(index, 1);
      setShoppingList(updatedList);
      saveShoppingList();
    };
  
    const addMemberToList = async (userId: string) => {
      const listRef = doc(FIREBASE_FIRESTORE, 'shoppingLists', listId);
      try {
        await updateDoc(listRef, {
          members: arrayUnion(userId),
        });
      } catch (error) {
        console.error('Erreur lors de l\'ajout du membre', error);
      }
    };

    const shareList = async () => {
        const itemsToBuy = shoppingList.filter(item => !item.isBought);
        const boughtItems = shoppingList.filter(item => item.isBought);
    
        let message = "🛒 **Ma Liste de Courses**\n\n";
    
        if (itemsToBuy.length > 0) {
            message += "📌 À acheter :\n";
            itemsToBuy.forEach(item => {
                message += `- ${item.name} (${item.quantity})\n`;
            });
        } else {
            message += "🎉 Tout est acheté !\n";
        }
    
        if (boughtItems.length > 0) {
            message += "\n✅ Déjà acheté :\n";
            boughtItems.forEach(item => {
                message += `- ${item.name} (${item.quantity})\n`;
            });
        }
    
        try {
            await Share.share({ message });
        } catch (error) {
            console.error("Erreur lors du partage", error);
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <LinearGradient
                colors={['#C153F8', '#E15D5A']}
                style={styles.header}
            >
            <Text style={styles.headerTitle}>Ma Liste de Courses</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Image source={require('../assets/images/arrowLeft.png')} style={{ width: 60, height: 60 }}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareList} style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>
            </LinearGradient>  
            <View style={styles.container}>
                <ScrollView>
                    {shoppingList.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => toggleBoughtStatus(index)}
                            onLongPress={() => deleteItem(index)}
                        >
                            <View style={[styles.itemContainer, item.isBought && styles.itemBought]}>
                                <Image
                                    source={item.isBought ? require('../assets/images/checkedCircle.png') : require('../assets/images/uncheckedCircle.png')}
                                    style={{ width: 24, height: 24, marginLeft: 10, marginRight: 10 }}
                                />
                                <Text style={styles.itemText}>
                                    {item.name} ({item.quantity})
                                </Text>
                                
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <LinearGradient
                        colors={['#C153F8', '#E15D5A']}
                        style={styles.newItemButton}
                    >
                        <Text style={styles.buttonText}>Ajouter un Article</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Nouvel Article</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom de l'article"
                                    value={itemName}
                                    onChangeText={setItemName}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Quantité"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                />
                                <TouchableOpacity onPress={addItem}>
                                    <LinearGradient
                                        colors={['#C153F8', '#E15D5A']}
                                        style={styles.addItemButton}
                                    >
                                        <Text style={styles.addItemText}>Ajouter</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
  }
  
  const styles = StyleSheet.create({
    header: {
        paddingTop: 30, 
        paddingBottom: 30, 
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center', 
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center', 
        flex: 2,
        marginRight: 50,
    },
    backButton: {
        position: 'absolute',
        borderRadius: 5,
    },
    backButtonText: {
        color: 'white',
        fontSize: 18,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 15,
        marginVertical: 5,
        borderBottomRightRadius: 35,
        borderBottomLeftRadius: 35,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        elevation: 5,
        borderWidth: 2,
        borderBottomWidth: 5,
        
    },
    itemBought: {
        backgroundColor: '#D1FAD7',
        textDecorationLine: 'line-through',
    },
    itemText: {
        fontSize: 16,
    },
    newItemButton: {
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        borderTopRightRadius:25,
        borderTopLeftRadius:25,
        borderBottomRightRadius:35,
        borderBottomLeftRadius:35,
        borderWidth:2,
        borderBottomWidth:5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#F0F0F0',
        padding: 10,
        borderTopRightRadius:25,
        borderTopLeftRadius:25,
        borderBottomRightRadius:35,
        borderBottomLeftRadius:35,
        borderWidth:2,
        borderBottomWidth:5,
        borderRadius: 5,
        marginBottom: 10,
    },
    addItemButton: {
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        borderTopRightRadius:25,
        borderTopLeftRadius:25,
        borderBottomRightRadius:35,
        borderBottomLeftRadius:35,
        borderWidth:2,
        borderBottomWidth:5,
        
    },
    addItemText: {
        color: 'white',
        fontWeight: 'bold',
    },
    shareButton: {
        position: 'absolute',
        right: 10,
        top: 30,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        borderTopRightRadius:25,
        borderTopLeftRadius:25,
        borderBottomRightRadius:35,
        borderBottomLeftRadius:35,
        borderWidth:2,
        borderBottomWidth:5,
    },

    shareButtonText: {
        color: '#C153F8',
        fontWeight: 'bold',
    },
  });
  